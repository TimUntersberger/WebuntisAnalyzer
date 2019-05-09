import Axios from "axios"

export default {
    async analyze(
        username: string,
        password: string,
        school: string,
        domain: string
    ) {
        let baseUrl = "http://localhost:8080"
        if (process.env.NODE_ENV === "production") {
            baseUrl = "http://webuntis-analyzer.baaka.io"
        }
        const response = await Axios.get(
            `${baseUrl}?username=${username}&password=${btoa(
                password
            )}&school=${encodeURI(school)}&domain=${encodeURI(domain)}`
        )
        return response.data
    }
}
