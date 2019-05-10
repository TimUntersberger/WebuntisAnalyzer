import Axios from "axios"
import { Base64 } from "js-base64"

let baseUrl = "http://localhost:8080"
if (process.env.NODE_ENV === "production") {
    baseUrl = "http://webuntis-analyzer.baaka.io"
}

export default {
    async analyze(
        username: string,
        password: string,
        school: string,
        domain: string
    ) {
        const response = await Axios.get(
            `${baseUrl}?username=${username}&password=${Base64.encode(
                password
            )}&school=${encodeURI(school)}&domain=${encodeURI(domain)}`
        )
        return response.data
    },
    async getLeaderboard() {
        const response = await Axios.get(baseUrl + "/leaderboard")
        return response.data
    }
}
