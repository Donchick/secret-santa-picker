import React from 'react';
import { v4 as uuidv4 } from 'uuid';

export class SantaOption {
  constructor(id, nickname = '', contact = '') {
    this.id = id || uuidv4();
    this.nickname = nickname;
    this.contact = contact;
  }
}

export function SantaEditor(props) {
    return <div className="santa-editor">
      <input type="text"
             name="nickname"
             onChange={(e) => props.handleChange(e.target.name, e.target.value)}
             value={props.santa.nickname}
             placeholder="Nickname"/>
      <input type="text"
             name="contact"
             className="contact"
             onChange={(e) => props.handleChange(e.target.name, e.target.value)}
             value={props.santa.contact}
             placeholder="Email"/>
    </div>;
};