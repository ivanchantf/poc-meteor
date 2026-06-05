import { Mongo } from 'meteor/mongo';
import { Meteor } from "meteor/meteor";
import { MongoInternals } from 'meteor/mongo';
import './offline';
export const CollectionUp = new Mongo.Collection('collectionUp');
// Explicitly tell jam:offline to track this collection
CollectionUp.keep()
Meteor.methods({
    async 'collectionUp.insert'(data,deviceId) {
        console.log('collectionUp.insert method called with data:', data, 'and deviceId:', deviceId);
        if (!data ) {
            throw new Meteor.Error('CollectionUp data is required');
        }
        const collectionUpId = await CollectionUp.insertAsync({ ...data, deviceId:deviceId });//, _id:uid
        return collectionUpId ;// CRITICAL FOR jam:offline:  must return the ID
    },
    async 'collectionUp.update'(data,deviceId) {
        if (!data._id || !data) {
            throw new Meteor.Error('CollectionUp _id and  data are required');
        }
        else{
            console.log('collectionUp.update method called with data:', data, 'and deviceId:', deviceId);
        }
        await CollectionUp.updateAsync({ _id: data._id },{...data, deviceId:deviceId})
        return data._id; // Return the ID of the updated collectionUp
    },
    async 'collectionUp.remove'(id,deviceId) {
        if (!id) {
            throw new Meteor.Error('CollectionUp id is required');
        }
        await CollectionUp.removeAsync({ _id: id, deviceId:deviceId });
            return id;// CRITICAL FOR jam:offline: Returning the id cleanly registers deletion sync completion
    },
    
    async 'collectionUp.read'() {
        return CollectionUp.find({}).fetch();
    }
});
