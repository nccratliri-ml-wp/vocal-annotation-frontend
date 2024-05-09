
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import AddBoxIcon from "@mui/icons-material/AddBox.js";

function InputWindow ( {showInputWindow, setShowInputWindow, handleCancel, objectType, speciesID, index, addNewObject, newObjectInputFieldText, setNewObjectInputFieldText, iconStyle} ) {

    return (
        <>
            <Tooltip title={`Add A New ${objectType}`}>
                <IconButton style={{padding: 0}} onClick={() => setShowInputWindow(true)}>
                    <AddBoxIcon style={iconStyle}/>
                </IconButton>
            </Tooltip>

            {showInputWindow &&
                <div className="input-window">

                    <div className='close-btn-container'>
                        <button className='close-btn' onClick={handleCancel}>✖</button>
                        <p className='window-header'>Input</p>
                    </div>

                    <form
                        className='input-window-form'
                        onSubmit={ (event) => addNewObject(event, speciesID, index)}
                    >
                        <input
                            className='input-field'
                            type='text'
                            required='required'
                            pattern='^[^,]{1,30}$'
                            title='No commas allowed. Max length 30 characters'
                            value={newObjectInputFieldText}
                            placeholder={`Add a new ${objectType}`}
                            onChange={ (event) => setNewObjectInputFieldText(event, index) }
                            autoFocus
                        />
                        <button className='input-window-submit-btn'>Submit</button>
                    </form>

                    <button className='input-window-cancel-btn' onClick={handleCancel}>Cancel</button>
                </div>
            }
        </>
    )

}

export default InputWindow