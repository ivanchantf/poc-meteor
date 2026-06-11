
import { Mongo } from 'meteor/mongo';
export const DeviceConnections = new Mongo.Collection('device_connections');
// Explicitly tell jam:offline to track this collection
DeviceConnections.keep()
if (Meteor.isServer) {
Meteor.publish('device.connections', function(deviceUuid) {
  //check(deviceUuid, String);
  return DeviceConnections.find({ deviceUuid });
});
// // 5. Publish the live stream channel
Meteor.publish('admin.deviceStatuses', function() {
  // If you want to be extra safe and ensure Meteor tracks changes 
  // on every property modification, fetch explicitly:
  return DeviceConnections.find({}, {
    fields: {
      deviceUuid: 1,
      connectionId: 1,
      ipAddress: 1,
      status: 1,
      lastSeen: 1,
      rooms: 1,
      model: 1,
      platform: 1,
      manufacturer: 1,
      sdkVersion: 1,
      version: 1
    }
  });
});
}