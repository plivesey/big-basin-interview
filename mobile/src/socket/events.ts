import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@asba/shared-types';

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
