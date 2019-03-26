import Axios, { AxiosAdapter, AxiosInstance } from "axios"
import * as CookieBuilder from "cookie"

export interface WebuntisSessionInformation {
    sessionId: string
    personType: number
    personId: number
}

export interface Subject {
    name: string
    normalizedName: string
    id: number
}

export default class Webuntis {
    school: string
    schoolbase64: string
    username: string
    password: string
    domain: string
    baseUrl: string
    id: string

    request: AxiosInstance
    sessionInformation: WebuntisSessionInformation
    cookies: string[]

    constructor(
        school: string,
        username: string,
        password: string,
        domain: string
    ) {
        this.school = school
        this.schoolbase64 = "_" + Buffer.from(school).toString("base64")
        this.username = username
        this.password = password
        this.domain = domain
        this.baseUrl = `https://${domain}/`
        this.id = "test"

        this.cookies = []
        this.request = Axios.create({
            baseURL: this.baseUrl,
            maxRedirects: 0,
            validateStatus: function(status) {
                return status >= 200 && status < 303 // default
            }
        })
    }

    async login(): Promise<WebuntisSessionInformation> {
        const response = await this.request({
            method: "POST",
            url: `/WebUntis/jsonrpc.do?school=${this.school}`,
            data: {
                id: this.id,
                method: "authenticate",
                params: {
                    user: this.username,
                    password: this.password,
                    client: this.id
                },
                jsonrpc: "2.0"
            }
        })

        if (typeof response.data !== "object")
            throw new Error("Failed to parse server response.")
        if (!response.data.result) throw new Error("Failed to login.")
        if (response.data.result.code)
            throw new Error(
                "Login returned error code: " + response.data.result.code
            )
        if (!response.data.result.sessionId)
            throw new Error("Failed to login. No session id.")

        this.sessionInformation = response.data.result

        return this.sessionInformation
    }

    async logout() {
        await this.request({
            method: "POST",
            url: `/WebUntis/jsonrpc.do?school=${this.school}`,
            data: {
                id: this.id,
                method: "logout",
                params: {},
                jsonrpc: "2.0"
            }
        })
        this.sessionInformation = null

        return true
    }

    async getAbsences(start: number, end: number): Promise<any[]> {
        const url = `/WebUntis/api/classreg/absences/students?startDate=${start}&endDate=${end}&studentId=${
            this.sessionInformation.personId
        }&excuseStatusId=-1`

        const response = await this.request({
            method: "GET",
            url,
            headers: {
                Cookie: this.buildCookies()
            }
        })

        return response.data.data.absences
    }

    async getTimetableAt(date: number) {
        const response = await this.request({
            url: `/WebUntis/jsonrpc.do?school=${this.school}`,
            method: "POST",
            headers: {
                Cookie: this.buildCookies()
            },
            data: {
                id: this.id,
                method: "getTimetable",
                params: {
                    id: this.sessionInformation.personId,
                    type: this.sessionInformation.personType,
                    startDate: date,
                    endDate: date
                },
                jsonrpc: "2.0"
            }
        })

        if (!response.data.result)
            throw new Error("Server didn't returned any result.")
        if (response.data.result.code)
            throw new Error(
                "Server returned error code: " + response.data.result.code
            )
        return response.data.result
    }

    async getTimetableForRange(start: number, end: number) {
        const response = await this.request({
            url: `/WebUntis/jsonrpc.do?school=${this.school}`,
            method: "POST",
            headers: {
                Cookie: this.buildCookies()
            },
            data: {
                id: this.id,
                method: "getTimetable",
                params: {
                    id: this.sessionInformation.personId,
                    type: this.sessionInformation.personType,
                    startDate: start,
                    endDate: end
                },
                jsonrpc: "2.0"
            }
        })

        if (!response.data.result)
            throw new Error("Server didn't returned any result.")
        if (response.data.result.code)
            throw new Error(
                "Server returned error code: " + response.data.result.code
            )

        return response.data.result
    }

    async getSubjects(): Promise<Subject[]> {
        const response = await this.request({
            method: "POST",
            url: `/WebUntis/jsonrpc.do?school=${this.school}`,
            headers: {
                Cookie: this.buildCookies()
            },
            data: {
                id: this.id,
                method: "getSubjects",
                params: {},
                jsonrpc: "2.0"
            }
        })

        if (!response.data.result)
            throw new Error("Server didn't returned any result.")
        if (response.data.result.code)
            throw new Error(
                "Server returned error code: " + response.data.result.code
            )

        return response.data.result.map(subject => ({
            ...subject,
            normalizedName: subject.name.substr(1, subject.name.length - 1)
        }))
    }

    buildCookies(): string {
        let cookies = []
        cookies.push(
            CookieBuilder.serialize(
                "JSESSIONID",
                this.sessionInformation.sessionId
            )
        )
        cookies.push(CookieBuilder.serialize("schoolname", this.schoolbase64))
        return cookies.join("; ")
    }
}
