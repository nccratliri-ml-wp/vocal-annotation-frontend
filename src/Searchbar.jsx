import {ReactSearchAutocomplete} from "react-search-autocomplete";

function Searchbar (){

    const items = [
        {
            id: 0,
            name: "Accipiter castanilius"
        },
        {
            id: 1,
            name: "Accipiter gentilis"
        },
        {
            id: 2,
            name: "Accipiter nisus"
        },
        {
            id: 3,
            name: "Aceros corrugatus"
        },
        {
            id: 4,
            name: "Acherontia atropos"
        },
        {
            id: 5,
            name: "Acheta domesticus"
        },
        {
            id: 6,
            name: "Acheta spec."
        },
        {
            id: 7,
            name: "Accipiter brevipes"
        },
        {
            id: 8,
            name: "Acinonyx jubatus"
        },
        {
            id: 9,
            name: "Acridotheres burmannicus"
        },
    ]


    const handleOnSearch = (string, results) => {
        // onSearch will have as the first callback parameter
        // the string searched and for the second the results.
        //console.log(string, results)
    }

    const handleOnHover = (result) => {
        // the item hovered
        //console.log(result)
    }

    const handleOnSelect = (item) => {
        // the item selected
        //console.log(item.name)
    }

    const handleOnFocus = () => {
        //console.log('Focused')
    }

    const formatResult = (item) => {
        return (
            <>
                <span style={{ display: 'block', textAlign: 'left' }}>{item.name}</span>
            </>
        )
    }

    return (
        <div id='searchbar' style={{ width: 500}}>
            <ReactSearchAutocomplete
                items={items}
                onSearch={handleOnSearch}
                onHover={handleOnHover}
                onSelect={handleOnSelect}
                onFocus={handleOnFocus}
                autoFocus
                formatResult={formatResult}
                placeholder='Search species...'
            />
        </div>
    )
}

export default Searchbar;