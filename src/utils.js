const excludeNonDigits = (event) => {
    // Prevent the default behavior if the pressed key is not a digit
    if (!/\d/.test(event.key)) {
        event.preventDefault()
    }
}

const excludeSpecialCharacters = (event) => {
    // Allow only letters, digits, hyphens, underscores, and dots
    const allowedCharacters = /^[a-zA-Z0-9\-\_\.]$/

    // Prevent the default behavior if the pressed key does not match the allowed characters
    if (!allowedCharacters.test(event.key)) {
        event.preventDefault()
    }
}

export {excludeNonDigits, excludeSpecialCharacters}