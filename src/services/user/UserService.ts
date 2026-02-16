import { Api } from "../ApiConfig";

import { formType } from "../../pages";

export interface IUser {
    id: string;
    name: string;
    email: string;
    password: string;
    status: boolean;
    role: string;
}

enum Course {
    CC = "CC",
    EC = "EC",
}

enum Role {
    bixe = "bixe",
    veterane = "veterane",
}

export enum ApprovalStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
}

export interface IUserGet {
    id:         string;
    name:       string;
    email:      string;
    status:     boolean;
    role:       Role;
    course:     Course;
    telephone?: string;
    yearOfEntry?: number;
    approvalStatus: ApprovalStatus;
    createdAt?: string;
    pronouns:   string[];
    ethnicity:  string[];
    city?:      string;
    lgbt:       string[];
    parties:    number;
    hobby?:     string;
    music?:     string;
    games?:     string;
    sports?:    string;
    picture?:    string;
    godchildRelation: godparentRelation[];
    whiteboard?: string;
}

interface IStatus {
    vets: number;
    bixes: number;
    total: number;
    approved: number;
    pending: number;
}

interface godparentRelation {
    godparent: IUserGet;
}


async function update(userId: string, data: Partial<formType>): Promise<IUser> {

    const response = await Api().put(`/users/${userId}`, data);
    return response.data;
}

async function get(userId: string): Promise<IUserGet> {

    const response = await Api().get(`/users/${userId}`);
    return response.data.user;
}

async function getPendingApprovals(): Promise<IUserGet[]> {
    const response = await Api().get(`/users/getPendingApproval`);
    return response.data;
}

async function approveUser(userId: string): Promise<void> {
    await Api().put(`/users/${userId}/approve`);
}

async function unapproveUser(userId: string): Promise<void> {
    await Api().put(`/users/${userId}/unapprove`);
}

async function getAllUsers(): Promise<IUserGet[]> {
    const response = await Api().get(`/users/all`);
    return response.data;
}

async function getStats(): Promise<IStatus> {
    const response = await Api().get(`/users/stats`);
    return response.data;
}

async function getGodparents(): Promise<IUserGet[]> {
    const response = await Api().get(`/users/godparents`);
    return response.data;
}

async function addGodparentRelations(data: string): Promise<void> {
    await Api().post(`/users/addGodparentRelations`, data);
}

async function getToMatch(): Promise<string> {
    const response = await Api().get(`/users/getToMatch`);

    return JSON.stringify(response.data);
}

async function runMatching(): Promise<any> {
    const response = await Api().post(`/matching/run`);
    return response.data;
}

async function updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await Api().put(`/users/${userId}/password`, { currentPassword, newPassword });
}

async function resetPassword(email: string): Promise<void> {
    await Api().post(`/users/resetPassword`, { email });
}

async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    await Api().post(`/users/resetPassword/confirm`, { token, newPassword });
}

export default { update, get, getPendingApprovals, getGodparents, approveUser, unapproveUser, getAllUsers, getStats, getToMatch, addGodparentRelations, runMatching, updatePassword, resetPassword, confirmPasswordReset };
