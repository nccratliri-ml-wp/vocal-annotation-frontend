import React, { useState } from 'react'

const Decrypt= () => {
    const [decryptedData, setDecryptedData] = useState(null)

    const handleDecryptClick = () => {
        const base64EncodedData = "Encoded Base64 string here"

        // Decode Base64 data
        const decodedData = atob(base64EncodedData)

        // Parse JSON data
        const jsonData = JSON.parse(decodedData)
        console.log("Decoded data:", jsonData)
    }

    return (
        <div>
            <button onClick={handleDecryptClick}>Decrypt Data</button>
            {decryptedData && <p>Decrypted Data: {decryptedData}</p>}
        </div>
    )
}

export default Decrypt
