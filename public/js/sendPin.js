async function sendPin() {
    const response = await fetch('http://127.0.0.1:3000/user/forgotPassword')
    console.log(response)
}