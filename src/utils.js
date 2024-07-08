const excludeNonDigits = (event) => {
    // Prevent the default behavior if the pressed key is not a digit
    if (!/\d/.test(event.key)) {
        event.preventDefault()
    }
}

export {excludeNonDigits}