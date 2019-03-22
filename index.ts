import Webuntis from "./webuntis"

function intToDate(x) {
    const str = new String(x)
    const year = str.substr(0, 4)
    const month = str.substr(4, 2)
    const day = str.substr(6, 2)
    return new Date(parseInt(year), parseInt(month), parseInt(day))
}

async function main() {
    const webuntis = new Webuntis(
        "htbla linz leonding",
        "if150152",
        "",
        "mese.webuntis.com"
    )
    await webuntis.login()
    const absences = await webuntis.getAbsences(20180910, 20190707)
    const subjects = await webuntis.getSubjects()
    const allLessons = await webuntis.getTimetableForRange(20180910, 20190707)
    const subject_count = {}
    const missedSubject_count = {}

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

    console.log(
        `You missed a total of ${Object.keys(missedSubject_count)
            .map(key => missedSubject_count[key])
            .reduce((x, y) => x + y)} hours`
    )

    Object.keys(missedSubject_count)
        .map(key => ({
            subject: subjects.filter(subject => subject.id == key)[0],
            count: missedSubject_count[key],
            percentage: Math.round(
                (missedSubject_count[key] / subject_count[key]) * 100
            )
        }))
        .sort((a, b) => b.count - a.count)
        .forEach(info =>
            console.log(
                `You missed ${info.count} hours of '${
                    info.subject.name
                }' that is ${info.percentage}%`
            )
        )
}

main()
