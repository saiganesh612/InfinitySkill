const approveReport = async (e, id, username, reportedOn) => {
    try {
        const response = await axios.post("/approve-report", { id, username, reportedOn })
        if (response.data.message !== "Approved") throw response.data.message
        e.innerText = "Approved"
        e.nextElementSibling.style.display = "none"
    } catch (err) {
        console.log(err)
        err = err ? err : "Something went wrong. Check your network connection and try again."
        alert(err)
    }
}

const rejectReport = async (e, id, username, reportedOn, contestName) => {
    try {
        const response = await axios.post("/reject-report", { id, username, reportedOn, contestName })
        if (response.data.message !== "Rejected") throw response.data.message
        e.innerText = "Rejected"
        e.previousElementSibling.style.display = "none"
    } catch (err) {
        console.log(err)
        err = err ? err : "Something went wrong. Check your network connection and try again."
        alert(err)
    }
}
