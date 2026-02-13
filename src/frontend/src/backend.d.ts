import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface ManufacturingRequest {
    id: string;
    status: RequestStatus;
    creator: Principal;
    createdAt: Time;
    currentApprovalLevel: bigint;
    updatedAt: Time;
    headerFields: string;
    approvalRecords: Array<ApprovalRecord>;
}
export type ApprovalLevel = bigint;
export interface ApprovalRecord {
    status: ApprovalStatus;
    comment?: string;
    approver: Principal;
    timestamp: Time;
}
export interface UserProfile {
    name: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum RequestStatus {
    submitted = "submitted",
    approved = "approved",
    rejected = "rejected",
    draft = "draft",
    inApproval = "inApproval"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    approveRequest(requestId: string, comment: string | null): Promise<void>;
    assignApprover(level: ApprovalLevel, approver: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllRequests(): Promise<Array<ManufacturingRequest>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getRequest(requestId: string): Promise<ManufacturingRequest>;
    getRequestsByLevel(level: ApprovalLevel): Promise<Array<ManufacturingRequest>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserRequests(user: Principal): Promise<Array<ManufacturingRequest>>;
    isCallerAdmin(): Promise<boolean>;
    reassignRequests(level: ApprovalLevel, newApprovers: Array<Principal>): Promise<void>;
    rejectRequest(requestId: string, comment: string | null): Promise<void>;
    removeApprover(level: ApprovalLevel, approver: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitRequest(headerFields: string): Promise<string>;
}
