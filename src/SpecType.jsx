import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

function SpecType( {specType, passSpecTypeToApp} ) {

    function handleChange(event){
        passSpecTypeToApp(event.target.value)
    }

    return (
        <FormControl id="spec-type-form">
            <FormLabel id="spec-type-label">Spectrogram Type</FormLabel>
            <RadioGroup
                aria-labelledby="spec-type-label"
                name="spec-type-group"
                value={specType}
                onChange={handleChange}
            >
                <FormControlLabel value="standard" control={<Radio />} label="Standard" />
                <FormControlLabel value="constant-q" control={<Radio />} label="Constant Q" />
            </RadioGroup>
        </FormControl>
    );
}

export default SpecType;