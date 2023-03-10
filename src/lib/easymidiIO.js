import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import easymidi from 'easymidi';
import { MidiNormalizer } from '#src/lib/midiNormalizer';
import { name, version, author } from '#src/lib/package';

const { log } = console;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const easymidiIO = {};
easymidiIO.getInputs = () => easymidi.getInputs();
easymidiIO.getOutputs = () => easymidi.getOutputs();
easymidiIO.startServer = (midiOutput, port, { midiInput } = {}) => {
  if (port === undefined) throw new Error('port is undefined');
  if (midiOutput === undefined) throw new Error('midi device output is undefined');
  let midiIn;

  const midiOut = new easymidi.Output(midiOutput);

  if (midiInput) { midiIn = new easymidi.Input(midiInput); }

  app.get('/', (req, res) => {
    res.send(`${name} - ${version}</br>${author}`);
  });

  server.listen(port, () => {
    log('listening on *:', port);
  });

  io.on('connection', (socket) => {
    log('a user connected');

    socket.on('midi', (message) => {
      log('server : received midi message from io client');
      log(message);
      const normalizedMessage = MidiNormalizer.message(message);
      const { _type } = message;
      // eslint-disable-next-line no-underscore-dangle
      delete normalizedMessage._type;
      midiOut.send(_type, normalizedMessage);
    });

    socket.on('dispose', () => {
      log('dispose');
      midiOut.close();
      if (midiInput) midiIn.close();
    });

    if (midiIn) {
      midiIn.on('cc', (message) => {
        log(`server : incoming midi message from device ${midiInput}`);
        log(message);
        socket.emit('midi', message);
      });
      midiIn.on('noteon', (message) => {
        log(`server : incoming midi message from device ${midiInput}`);
        log(message);
        socket.emit('midi', message);
      });
      midiIn.on('noteoff', (message) => {
        log(`server : incoming midi message from device ${midiInput}`);
        log(message);
        socket.emit('midi', message);
      });
    }
  });
};

export default easymidiIO;
export {
  easymidi,
  easymidiIO,
};
