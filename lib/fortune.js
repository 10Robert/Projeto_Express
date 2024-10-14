
const times = ['Santos']

exports.getFortune = () => {
    const idx = Math.floor(Math.random() * times.length)
    return times[idx]
}