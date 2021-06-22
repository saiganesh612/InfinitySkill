const handlePayment = async amount => {
    try {
        // validate the current user
        const validatedInfo = await axios.post("/validate-data", { user: currentUser, contestId })
        console.log(validatedInfo)
        if (validatedInfo.data.message !== "Data validated successfully.") throw validatedInfo.data.message

        // initiate the payment
        const stripe = Stripe(stripePublicKey);
        const res = await axios.post("/create-checkout-session", { amount, id: contestId, image })

        if (!res.data.id) throw res.data.message;

        const result = await stripe.redirectToCheckout({ sessionId: res.data.id })
        console.log(result)

    } catch (err) {
        console.log(err)
        err = err ? err : "Your payment is aborted."
        alert(err)
    }
}
