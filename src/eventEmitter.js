/*
This file sets up an emitter object.
We use this in Track.jsx to pass active label quickly from one track to another, this is important when dealing
with thousands of labels simultaneously.
 */

import mitt from 'mitt';

const emitter = mitt();

export default emitter;
