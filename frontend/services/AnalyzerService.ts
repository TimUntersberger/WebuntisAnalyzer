import Axios from "axios"

export default {
    async analyze(username: string, password: string) {
        let baseUrl = "http://localhost:8000"
        if (process.env.NODE_ENV === "production") {
            baseUrl = "http://104.248.40.100:8000"
        }
        const response = await Axios.get(
            `${baseUrl}?username=${username}&password=${password}`
        )
        return response.data
    }
}
