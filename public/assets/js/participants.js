const handleSubmit = () => {
    const points = document.getElementById("adminPoints").value
    const pname = document.getElementById("pn").value

    if (!pname || !points) {
        alert("Enter all fields...")
        return
    }

    const index = participantsData.findIndex(p => p.user === pname)
    if (index === -1) {
        alert("User not found. Please check spelling and try again.")
        return
    }
    document.getElementById("pn").value = ""
    document.getElementById("adminPoints").value = ""
    calculatePoints(participantsData, userObj, contestOwner, index + 1, parseInt(points))
}

const calculatePoints = (participants, currentUser, owner, index, adminPoints = 0) => {
    const { _id } = window.contest
    const points = document.getElementById(parseInt(index))
    const btns = document.getElementsByClassName(parseInt(index))
    let tempPoints

    if (currentUser.username === "Admin" && !isNaN(adminPoints)) tempPoints = parseInt(points.innerText) + adminPoints
    else if (currentUser.username === owner) tempPoints = parseInt(points.innerText) + 10
    else if (participants.filter(p => p.user === currentUser.username).length) tempPoints = parseInt(points.innerText) + 5
    else tempPoints = parseInt(points.innerText) + 1

    const cun = btns[0].innerText

    axios.post(`/manage-votes/${_id}`, { cun, pts: tempPoints })
        .then(res => {
            btns[1].classList.remove("display")
            btns[1].classList.add("not-display")
            btns[2].classList.remove("not-display")
            btns[2].classList.add("display")
            points.innerText = tempPoints
        })
        .catch(err => {
            console.log(err)
            alert("You already made a vote to this contestant.")
        })
}
