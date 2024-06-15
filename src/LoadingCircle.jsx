import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const LoadingCircle = ({ progress }) => {
    return (
        <Box position="relative" display="inline-flex">
            <CircularProgress variant="determinate" value={progress} />
            <Box
                top={0}
                left={0}
                bottom={0}
                right={0}
                position="absolute"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Typography variant="caption" component="div"  sx={{ color: 'white' }}>{`${Math.round(
                    progress,
                )}%`}</Typography>
            </Box>
        </Box>
    );
};

export default LoadingCircle;