const stripeHandler = StripeCheckout.configure({
    key: stripePublicKey,
    locale: "india",
    token: function (token) {
        axios.post("/validate-data", { id: token.id, email: token.email, user: currentUser, contestId })
            .then((res) => {
                console.log(res)
                alert(res.data.message)
            })
            .catch(err => {
                console.log(err)
                alert("Payment aborted")
            })
    }
})

const handlePayment = (amount) => {
    stripeHandler.open({
        amount: amount * 100,
        currency: 'INR'
    })
}
