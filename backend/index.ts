import Webuntis from "./webuntis"
import * as express from "express"
import * as cors from "cors"

async function analyze(username: string, password: string) {
    const webuntis = new Webuntis(
        "htbla linz leonding",
        username,
        password,
        "mese.webuntis.com"
    )
    await webuntis.login()
    const absences = await webuntis.getAbsences(20180910, 20190707)
    const subjects = await webuntis.getSubjects()
    const allLessons = await webuntis.getTimetableForRange(20180910, 20190707)
    const subject_count = {}
    const missedSubject_count = {}
    const result = {}

    allLessons.forEach(lesson => {
        if (lesson.code || !lesson.su[0]) return

        const subjectId = lesson.su[0].id

        if (!subject_count[subjectId]) subject_count[subjectId] = 0

        subject_count[subjectId]++
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

            if (startDate === endDate) {
                const lessons = await webuntis.getTimetableAt(startDate)

                lessons.forEach(lesson => {
                    if (
                        lesson.startTime >= startTime &&
                        lesson.endTime <= endTime &&
                        !lesson.code
                    ) {
                        const missedSubjectId = lesson.su[0].id

                        if (!missedSubject_count[missedSubjectId])
                            missedSubject_count[missedSubjectId] = 0

                        missedSubject_count[missedSubjectId]++
                    }
                })
            }
            //handle absence longer than 1 day
            else {
                const lessons = await webuntis.getTimetableForRange(absence.startDate, absence.endDate)

                lessons.forEach(lesson => {
                    if (
                        lesson.startTime >= startTime &&
                        lesson.endTime <= endTime &&
                        !lesson.code
                    ) {
                        const missedSubjectId = lesson.su[0].id

                        if (!missedSubject_count[missedSubjectId])
                            missedSubject_count[missedSubjectId] = 0

                        missedSubject_count[missedSubjectId]++
                    }
                })
            }
        })
    )

    result["total"] = Object.keys(missedSubject_count)
            .map(key => missedSubject_count[key])
            .reduce((x, y) => x + y)

    result["infoPerSubject"] = Object.keys(missedSubject_count)
        .map(key => ({
            subject: subjects.filter(subject => subject.id == key)[0],
            count: missedSubject_count[key],
            percentage: Math.round(
                (missedSubject_count[key] / subject_count[key]) * 100
            )
        }))
        .sort((a, b) => b.count - a.count)

    webuntis.logout()

    return result
}

const server = express()

server.use(cors())

server.get("/", async (req: express.Request, res: express.Response) => {
    const { username, password } = req.query
    res.json(await analyze(username, password))
})

server.listen(8000)