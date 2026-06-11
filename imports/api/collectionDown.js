// imports/api/CollectionDown.js
import { Mongo } from 'meteor/mongo';
export const CollectionDown = new Mongo.Collection('collectionDown');

if (Meteor.isServer) {
  Meteor.publish('collectionDown', function (roomsArray) {
    if (!roomsArray || !Array.isArray(roomsArray)) return this.ready();
    
    // Returns the cursor. Meteor handles the async streaming under the hood.
    return CollectionDown.find({ roomName: { $in: roomsArray } });
  });
}