import React from 'react';
import './santas-picker.css';
import {SantaEditor, SantaOption} from './santa-editor';

class ServerError extends Error{
  constructor(errorsList) {
    super();
    this.errors = errorsList;
  }
}

export default class SantasPicker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      santas: [new SantaOption(), new SantaOption(), new SantaOption()],
      loading: false,
      errors: null,
      pickingFinished: false,
    };
  }

  handleSantaChange(index, field, value) {
    const santaToUpdate = this.state.santas[index];
    santaToUpdate[field] = value;

    this.setState(({santas}) => ({
      santas: [
        ...santas.slice(0, index),
        new SantaOption(santaToUpdate.id, santaToUpdate.nickname, santaToUpdate.contact),
        ...santas.slice(index + 1),
      ],
    }));
  }

  addSanta() {
    this.setState(({santas}) => ({
      santas: santas.concat([new SantaOption()])
    }));
  }

  deleteSanta(index) {
    this.setState(({santas}) => ({
      santas: [...santas.slice(0, index), ...santas.slice(index + 1)],
    }));
  }

  async pickSantas() {
    this.setState({
      loading: true,
      errors: null,
    });

    try {
      const response = await fetch('api/pick-secret-santa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.state.santas),
      });

      if (response.status === 200) {
        this.setState({
          pickingFinished: true,
        });
      } else {
        const errors = (await response.json()).errors;
        throw errors && errors.length > 0 ? new ServerError(errors)
            : new Error();
      }
    } catch (e) {
      this.setState({
        errors: e instanceof ServerError && e.errors.length > 0
            ? e.errors
            : ['Something went wrong during your request. Please try again.'],
      });
    }

    this.setState({loading: false});
  }

  render() {
    return <div className="santas-form">
      <h1>Welcome to Secret Santa Picker</h1>
      {this.state.loading && <div className="loading-indicator"></div>}
      {this.state.errors && <ul className="errors-list">{this.state.errors.map((error, index) => <li key={index}>{error}</li>)}</ul>}
      {this.state.pickingFinished
          ? <div className="success-message">Congrats! All santas were picked!</div>
          : <div>
              {this.state.santas.map(
                  (santa, index) => {
                    return <div key={santa.id} className="santa-row">
                      <SantaEditor santa={santa}
                                   handleChange=
                                       {this.handleSantaChange.bind(this, index)}/>
                      {index > 2 && <button onClick={this.deleteSanta.bind(this, index)} className="delete-icon">X</button>}
                    </div>
                })}

            <button onClick={() => this.addSanta()} className="btn">Add Santa</button>
            <button onClick={() => this.pickSantas()} className="pick-santa btn">Pick Santas</button>
          </div>
      }
    </div>;
  }
}