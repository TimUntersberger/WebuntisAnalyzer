import Axios, { AxiosResponse } from "axios"
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
    //havara
    const response = await Axios.get(
      `${baseUrl}?username=${username}&password=${Base64.encode(
        password
      )}&school=${encodeURI(school)}&domain=${encodeURI(domain)}`
    )
    return response.data
  },
  async getLeaderboard(filter?: { className: any; school: any }) {
    let url: string = null

    if (filter) {
      url =
        baseUrl +
        "/leaderboard?" +
        Object.keys(filter)
          .filter(key => filter[key])
          .map(key => `${key}=${filter[key]}`)
          .join("&")
    } else url = baseUrl + "/leaderboard"
    const response = await Axios.get(url)
    return response.data
  },
  async getClassNames() {
    const response = await Axios.get(baseUrl + "/classes")
    return response.data
  },
  async getSchools() {
    const response = await Axios.get(baseUrl + "/schools")
    return response.data
  }
}
