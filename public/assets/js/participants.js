const calculatePoints = (participants, currentUser, owner, index) => {
    const { _id } = window.contest
    const points = document.getElementById(parseInt(index))
    const btns = document.getElementsByClassName(parseInt(index))
    let tempPoints

    if (currentUser.username === "Admin") tempPoints = parseInt(points.innerText) + 50
    else if (currentUser.username === owner) tempPoints = parseInt(points.innerText) + 10
    else if (participants.filter(p => p.user === currentUser.username).length) tempPoints = parseInt(points.innerText) + 5
    else tempPoints = parseInt(points.innerText) + 1

    const cun = btns[0].innerText

    axios.post(`/manage-votes/${_id}`, { cun, pts: tempPoints })
        .then(res => {
            console.log(res)
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
