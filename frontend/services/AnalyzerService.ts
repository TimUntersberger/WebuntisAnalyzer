import Axios from "axios";

export default {
    async analyze(username: string, password: string){
        const response = await Axios.get(`http://localhost:8000?username=${username}&password=${password}`)
        return response.data
    }
}