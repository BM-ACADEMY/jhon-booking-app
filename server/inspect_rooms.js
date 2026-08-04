import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import Room from './models/Room.js';

const canAccommodateCombination = (roomsList, adults, children) => {
  const n = roomsList.length;
  if (adults < n) return false;

  const backtrack = (index, remainingAdults, remainingChildren) => {
    if (index === n) {
      return remainingAdults === 0 && remainingChildren === 0;
    }

    const room = roomsList[index];
    const maxOccupancy = room.maxOccupancy !== undefined && room.maxOccupancy !== null ? room.maxOccupancy : (room.guests || 2);

    const upperA = Math.min(maxOccupancy, remainingAdults);
    for (let a = 1; a <= upperA; a++) {
      const upperC = Math.min(maxOccupancy - a, remainingChildren);
      for (let c = 0; c <= upperC; c++) {
        if (backtrack(index + 1, remainingAdults - a, remainingChildren - c)) {
          return true;
        }
      }
    }
    return false;
  };

  return backtrack(0, adults, children);
};

const isRoomInValidCombination = (room, pool, roomsCount, adults, children) => {
  const combination = Array(roomsCount).fill(room);
  return canAccommodateCombination(combination, adults, children);
};

async function main() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const rooms = await Room.find({ status: 'published' });
  console.log(`Testing 1 Adult, 0 Children, 1 Room:`);
  rooms.forEach(r => {
    const res = isRoomInValidCombination(r, rooms, 1, 1, 0);
    console.log(`Room: "${r.name}" | maxOccupancy: ${r.maxOccupancy} | Match: ${res}`);
  });
  await mongoose.disconnect();
}

main().catch(err => console.error(err));
