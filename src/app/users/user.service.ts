import { Injectable } from '@angular/core';
import {AngularFire} from "angularfire2";
import {Observable, ReplaySubject} from "rxjs";
import {User} from "./user";
import {firebaseConfig} from "../app.settings";
import {Profile} from "./profile";
let firebase = require("firebase");

@Injectable()
export class UserService {

  app;
  constructor(private af : AngularFire) { }

  getUsers() : Observable<User[]>{
    return this.af.database.list('users');
  }

  getUser($key: string) : Observable<User>{
    return this.af.database.object('users/' + $key);
  }

  createUser(user: User) : ReplaySubject<any> {
    let resultSubject = new ReplaySubject(1);

    if(!this.app){
      this.app = firebase.initializeApp(firebaseConfig,"secondary");
    }
    this.app.auth().createUserWithEmailAndPassword(user.profile.email, user.password)
      .then(fbAuth => {
        var updatedUserData = {};
        updatedUserData[`roles/${user.role.$key}/users/${fbAuth.uid}`] = true;
        updatedUserData[`users/${fbAuth.uid}`] = {
          profile:{
            email: user.profile.email,
            username: user.profile.username
          },
          role:{
            id: user.role.$key,
            name: user.role.name
          }
        };
        this.af.database.object('').update(updatedUserData)
          .then(() => {
            resultSubject.next(user);
          })
          .catch(err => {
            resultSubject.error(err);
          })
      })
      .catch(err => {
        resultSubject.error(err);
      });
    return resultSubject;
  }

  updateUserProfile(user : User) : Observable<User>{
    let resultSubject = new ReplaySubject(1);
    if(user !== undefined &&
      user.$key !== undefined){
      let dataToUpdate = {};
      dataToUpdate[`users/${user.$key}/profile/username`] =
        user.profile.username;
      dataToUpdate[`users/${user.$key}/profile/displayName`] =
        user.profile.displayName;
      //dataToUpdate[`users/${user.$key}/profile/email`] = user.profile.email;
      this.af.database.object('')
        .update(dataToUpdate)
        .then(() => {
          resultSubject.next(user);
          resultSubject.complete();
        })
        .catch(err => {
          resultSubject.error(err);
          resultSubject.complete();
        });
    }
    return resultSubject;
  }

  deleteUser(user : User) : ReplaySubject<any>{
    let resultSubject = new ReplaySubject(1);
    if(user !== undefined && user.$key !== undefined){
      let dataToDelete = {};
      dataToDelete[`users/${user.$key}`] = null;
      dataToDelete[`roles/${user.role.id}/users/${user.$key}`] = null;
      this.af.database.object('').update(dataToDelete)
        .then(() => {
          resultSubject.next(user);
        })
        .catch(err => {
          resultSubject.error(err);
        })
    }
    return resultSubject;
  }
}
