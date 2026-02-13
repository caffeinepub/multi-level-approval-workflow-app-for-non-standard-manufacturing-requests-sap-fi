import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type ApprovalLevel = Nat;

  type ApprovalStatus = {
    #pending;
    #approved;
    #rejected;
  };

  type ApprovalRecord = {
    status : ApprovalStatus;
    approver : Principal;
    timestamp : Time.Time;
    comment : ?Text;
  };

  type RequestStatus = {
    #draft;
    #submitted;
    #inApproval;
    #approved;
    #rejected;
  };

  public type ManufacturingRequest = {
    id : Text;
    creator : Principal;
    headerFields : Text;
    currentApprovalLevel : Nat;
    approvalRecords : [ApprovalRecord];
    status : RequestStatus;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  module ManufacturingRequest {
    public func compare(a : ManufacturingRequest, b : ManufacturingRequest) : Order.Order {
      switch (Int.compare(b.updatedAt, a.updatedAt)) {
        case (#equal) { Text.compare(a.id, b.id) };
        case (order) { order };
      };
    };
  };

  public type UserProfile = {
    name : Text;
  };

  let requests = Map.empty<Text, ManufacturingRequest>();
  let approvalLevelUsers = Map.empty<ApprovalLevel, List.List<Principal>>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Manufacturing request workflow functions
  public shared ({ caller }) func submitRequest(headerFields : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit requests");
    };

    let requestId = headerFields # "_" # Time.now().toText();

    let newRequest : ManufacturingRequest = {
      id = requestId;
      creator = caller;
      headerFields;
      currentApprovalLevel = 0;
      approvalRecords = [];
      status = #submitted;
      createdAt = Time.now();
      updatedAt = Time.now();
    };

    requests.add(requestId, newRequest);
    requestId;
  };

  public shared ({ caller }) func approveRequest(requestId : Text, comment : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can approve requests");
    };

    let request = switch (requests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?request) { request };
    };

    // Check if request is in a state that can be approved
    if (request.status != #submitted and request.status != #inApproval) {
      Runtime.trap("Request cannot be approved in current status");
    };

    // Verify caller is an approver for the current level
    if (not hasApprovalAccess(caller, request.currentApprovalLevel)) {
      Runtime.trap("Unauthorized: You are not an approver for this level");
    };

    let approvalRecord : ApprovalRecord = {
      status = #approved;
      approver = caller;
      timestamp = Time.now();
      comment;
    };

    let updatedRecords = request.approvalRecords.concat([approvalRecord]);
    let newApprovalLevel = request.currentApprovalLevel + 1;

    let newStatus : RequestStatus = if (newApprovalLevel >= 8) {
      #approved;
    } else {
      #inApproval;
    };

    let updatedRequest : ManufacturingRequest = {
      request with
      approvalRecords = updatedRecords;
      currentApprovalLevel = newApprovalLevel;
      status = newStatus;
      updatedAt = Time.now();
    };

    requests.add(requestId, updatedRequest);
  };

  public shared ({ caller }) func rejectRequest(requestId : Text, comment : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can reject requests");
    };

    let request = switch (requests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?request) { request };
    };

    // Check if request is in a state that can be rejected
    if (request.status != #submitted and request.status != #inApproval) {
      Runtime.trap("Request cannot be rejected in current status");
    };

    // Verify caller is an approver for the current level
    if (not hasApprovalAccess(caller, request.currentApprovalLevel)) {
      Runtime.trap("Unauthorized: You are not an approver for this level");
    };

    let approvalRecord : ApprovalRecord = {
      status = #rejected;
      approver = caller;
      timestamp = Time.now();
      comment;
    };

    let updatedRecords = request.approvalRecords.concat([approvalRecord]);
    let updatedRequest : ManufacturingRequest = {
      request with
      approvalRecords = updatedRecords;
      status = #rejected;
      updatedAt = Time.now();
    };

    requests.add(requestId, updatedRequest);
  };

  public query ({ caller }) func getRequest(requestId : Text) : async ManufacturingRequest {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view requests");
    };

    switch (requests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?request) {
        // Allow access if: creator, approver for current level, or admin
        let isCreator = request.creator == caller;
        let isApprover = hasApprovalAccess(caller, request.currentApprovalLevel);
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);

        if (not (isCreator or isApprover or isAdmin)) {
          Runtime.trap("Unauthorized: You do not have access to this request");
        };
        request;
      };
    };
  };

  public query ({ caller }) func getUserRequests(user : Principal) : async [ManufacturingRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view requests");
    };

    // Users can only view their own requests unless they are admin
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You can only view your own requests");
    };

    let allRequests = requests.values().toArray();
    allRequests.filter(func(r : ManufacturingRequest) : Bool { r.creator == user });
  };

  public query ({ caller }) func getRequestsByLevel(level : ApprovalLevel) : async [ManufacturingRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view requests");
    };

    // Only approvers for this level or admins can view requests at this level
    if (not hasApprovalAccess(caller, level) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You are not an approver for this level");
    };

    let allRequests = requests.values().toArray();
    allRequests.filter(func(r : ManufacturingRequest) : Bool {
      r.currentApprovalLevel == level and (r.status == #submitted or r.status == #inApproval)
    });
  };

  func hasApprovalAccess(user : Principal, level : ApprovalLevel) : Bool {
    let users = switch (approvalLevelUsers.get(level)) {
      case (null) { List.empty<Principal>() };
      case (?u) { u };
    };
    users.any(func(u : Principal) : Bool { u == user });
  };

  public shared ({ caller }) func assignApprover(level : ApprovalLevel, approver : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can assign approvers");
    };

    let users = switch (approvalLevelUsers.get(level)) {
      case (null) { List.empty<Principal>() };
      case (?u) { u };
    };
    users.add(approver);
    approvalLevelUsers.add(level, users);
  };

  public shared ({ caller }) func removeApprover(level : ApprovalLevel, approver : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove approvers");
    };

    let users = switch (approvalLevelUsers.get(level)) {
      case (null) { List.empty<Principal>() };
      case (?u) {
        u.filter(func(user : Principal) : Bool { user != approver });
      };
    };
    approvalLevelUsers.add(level, users);
  };

  public shared ({ caller }) func reassignRequests(level : ApprovalLevel, newApprovers : [Principal]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reassign requests");
    };

    approvalLevelUsers.add(level, List.fromArray(newApprovers));
  };

  public query ({ caller }) func getAllRequests() : async [ManufacturingRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all requests");
    };
    let allRequests = requests.values().toArray();
    allRequests.sort();
  };
};
