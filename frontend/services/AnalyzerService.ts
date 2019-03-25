import Axios from "axios"

export default {
    async analyze(username: string, password: string) {
        let baseUrl = ""
        if (process.env.NODE_ENV === "production") {
            baseUrl = "http://www.baaka.io:8000"
        } else {
            baseUrl = "http://localhost:8000"
        }
        const response = await Axios.get(
            `${baseUrl}?username=${username}&password=${password}`
        )
        return response.data
    }
}
