import { Meteor } from "meteor/meteor";
import { CollectionUp } from "./collectionUp";
Meteor.publish("collectionUp", () => {
  return CollectionUp.find();
});
