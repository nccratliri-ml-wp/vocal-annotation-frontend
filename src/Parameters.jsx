import React, { useEffect, useState, useRef } from "react";

function Parameters( {parameters, passParametersToApp} ) {
    const [keyInput, setKeyInput] = useState("");
    const [valueInput, setValueInput] = useState("");
    //const [parameters, setParameters] = useState({});
    const [parameterList, setParameterList] = useState([]);
    const valueInputRef = useRef(null);

    const handleKeyChange = (event) => {
        setKeyInput(event.target.value);
    };

    const handleValueChange = (event) => {
        setValueInput(event.target.value);
    };

    const handleKeyPress = (event) => {
        if (event.key === "Enter") {
            if (keyInput !== "" && valueInput !== "") {
                // If both keyInput and valueInput are not empty, create a new key-value pair
                const newKeyValuePair = { [keyInput]: valueInput };

                // Update both the parameters state and the parameterList state

                passParametersToApp({
                        ...parameters,
                        [keyInput]: valueInput,
                    })
                setParameterList((prevList) => [...prevList, newKeyValuePair]);

                // Clear both key and value inputs
                setKeyInput("");
                setValueInput("");
            } else if (keyInput !== "") {
                // If only keyInput is not empty, focus on the value input
                valueInputRef.current.focus();
            }
        }
    };

    const handleRemove = (key) => {
        // Remove the key-value pair from both parameters object and parameterList
        const { [key]: removedKey, ...newParameters } = parameters;
        const newParameterList = parameterList.filter((item) => Object.keys(item)[0] !== key);

        //setParameters(newParameters);
        passParametersToApp(newParameters)
        setParameterList(newParameterList);
    };

    return (
        <div>
            <form>
                <input
                    id="parameter-key-input"
                    type="text"
                    required="required"
                    placeholder="key"
                    value={keyInput}
                    onChange={handleKeyChange}
                    onKeyPress={handleKeyPress}
                />
                <input
                    id="parameter-value-input"
                    type="text"
                    required="required"
                    placeholder="value"
                    value={valueInput}
                    onChange={handleValueChange}
                    onKeyPress={handleKeyPress}
                    ref={valueInputRef}
                />
            </form>
            <ul>
                {parameterList.map((item, index) => (
                    <li key={index}>
                        {Object.keys(item)[0]}: {Object.values(item)[0]}
                        <button onClick={() => handleRemove(Object.keys(item)[0])}>❌</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Parameters;
