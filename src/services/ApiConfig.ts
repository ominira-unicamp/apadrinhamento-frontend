import axios from "axios"

export const Api = () => {
    return axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        withCredentials: true,
    });
}

export const ApiWithToken = (token: string) => {
    return axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        withCredentials: true,
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}