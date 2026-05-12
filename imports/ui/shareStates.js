import { ReactiveVar } from 'meteor/reactive-var';

export const ListenerMessage = new ReactiveVar('');
export const ActionList=new ReactiveVar([])
export const addToActionList=(action)=>{
  const currentActions = ActionList.get();
  ActionList.set([...currentActions, [`[${new Date().toLocaleString()}]      ${action}`]]);
}