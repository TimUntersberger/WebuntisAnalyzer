import Webuntis from "./webuntis"
import * as express from "express"
import * as cors from "cors"
import * as mongo from "mongodb"

async function main() {
    const client = await mongo.connect("mongodb://localhost:27017")
    const db = client.db("webuntis_analyzer")
    const users = db.collection("users")

    async function analyze(
        username: string,
        password: string,
        school: string = "htbla linz leonding",
        domain: string = "mese.webuntis.com"
    ) {
        const webuntis = new Webuntis(
            school,
            username,
            Buffer.from(password, "base64").toString(),
            domain
        )

        console.log(`User ${username} requested data of ${school} on ${domain}`)

        try {
            await webuntis.login()
            const u = await users.findOne({ username })

            if (!u)
                users.insertOne({
                    username,
                    school,
                    domain,
                    hours: -1,
                    updatedAt: -1,
                    lastName: null,
                    department: null,
                    gender: null
                })
        } catch (ex) {
            console.error(ex.message)
            return {
                error: ex.message
            }
        }

        const profile = await webuntis.getProfile()
        const absences = await webuntis.getAbsences(20180910, 20190707)
        const subjects = await webuntis.getSubjects()
        const allLessons = await webuntis.getTimetableForRange(
            20180910,
            20190707
        )
        const subject_count = {}
        const missedSubject_count = {}
        const result = {}

        users.updateOne(
            { username },
            {
                $set: {
                    lastName: profile.name,
                    department: profile.department,
                    gender: profile.gender.longLabel.replace("LBL_", "")
                }
            }
        )

        const getSubjectById = id =>
            subjects.filter(subject => subject.id === id)[0]

        allLessons.forEach(lesson => {
            if (lesson.code || !lesson.su[0]) return

            const subject = getSubjectById(lesson.su[0].id)

            if (!subject_count[subject.normalizedName])
                subject_count[subject.normalizedName] = 0

            subject_count[subject.normalizedName]++
        })

        await Promise.all(
            absences.map(async absence => {
                const {
                    startDate,
                    endDate,
                    startTime,
                    endTime,
                    isExcused
                } = absence

                const lessons =
                    startDate === endDate
                        ? await webuntis.getTimetableAt(startDate)
                        : await webuntis.getTimetableForRange(
                              absence.startDate,
                              absence.endDate
                          )

                lessons.forEach(lesson => {
                    if (
                        lesson.startTime >= startTime &&
                        lesson.endTime <= endTime &&
                        !lesson.code
                    ) {
                        const missedSubject = getSubjectById(lesson.su[0].id)

                        if (!missedSubject_count[missedSubject.normalizedName])
                            missedSubject_count[
                                missedSubject.normalizedName
                            ] = 0

                        missedSubject_count[missedSubject.normalizedName]++
                    }
                })

                if (!isExcused)
                    result["unexcused_absences_count"] =
                        (result["unexcused_absences_count"] || 0) + 1
            })
        )

        result["total"] = Object.keys(missedSubject_count)
            .map(key => missedSubject_count[key])
            .reduce((x, y) => x + y)

        result["infoPerSubject"] = Object.keys(missedSubject_count)
            .map(key => ({
                subject: {
                    name: key
                },
                count: missedSubject_count[key],
                percentage: Math.round(
                    (missedSubject_count[key] / subject_count[key]) * 100
                )
            }))
            .sort((a, b) => b.count - a.count)

        webuntis.logout()

        users.updateOne(
            { username },
            {
                $set: {
                    hours: result["total"],
                    updatedAt: Date.now()
                }
            }
        )

        return result
    }

    const server = express()

    server.use(cors())

    server.get("/", async (req: express.Request, res: express.Response) => {
        const { username, password, school, domain } = req.query
        res.json(await analyze(username, password, school, domain))
    })

    server.get(
        "/leaderboard",
        async (req: express.Request, res: express.Response) => {
            res.json(
                Object.values(
                    (await users.find().toArray()).sort(
                        (a: any, b: any) => b.hours - a.hours
                    )
                )
            )
        }
    )

    server.listen(8080)
}

main()
