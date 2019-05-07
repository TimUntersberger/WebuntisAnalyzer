import Axios from "axios"

export default {
  async analyze(username: string, password: string) {
    let baseUrl = "http://localhost:8080"
    if (process.env.NODE_ENV === "production") {
      baseUrl = "http://webuntis-analyzer.baaka.io"
    }
    const response = await Axios.get(
      `${baseUrl}?username=${username}&password=${password}`
    )
    return response.data
  }
}
