const size = [40, 100];
const avgRoomCount = 6;
const DungeonGenerator = require('./DungeonGenerator.js');
const PlayerRenderer = require('./PlayerRenderer.js');
const React = require('react');

var DungeonMap = React.createClass({
  componentDidMount: function() {
    DungeonGenerator.renderer.initialize(this.props.dungeon, this.refs.canvas);
    this.updateMap();
  },
  updateMap: function() {
    this.forceUpdate();
  },
  render: function() {
    DungeonGenerator.renderer.update();
    return (
      <div>
        <canvas style={{zIndex: 0, position: "absolute"}} ref="canvas" width={this.props.width} height={this.props.height}/>
      </div>
    );
  }
});

var Player = React.createClass({
  getInitialState: function() {
    var [x, y] = this.props.dungeon.getRandomFreeSpace();
    return {
      enemies: {
        killed: 0,
        total: this.props.dungeon.enemyCount
      },
      health: 100,
      weapon: {
        attack: 5,
        name: "Stick"
      },
      x: x,
      y: y
    };
  },
  componentDidMount: function() {
    PlayerRenderer.initialize(this.refs.canvas, this.props.dungeon.mapSize);
    this.forceUpdate();
    window.addEventListener('keydown', this.movePlayer);
  },
  componentWillUnmount: function() {
    window.removeEventListener('keydown', this.movePlayer);
  },
  movePlayer: function(e) {
    var x = this.state.x;
    var y = this.state.y;
    switch (e.code) {
      case 'ArrowUp': y--; break;
      case 'ArrowDown': y++; break;
      case 'ArrowLeft': x--; break;
      case 'ArrowRight': x++; break;
      default: return;
    }
    switch(this.props.dungeon.map[x][y]) {
      case 3:
        PlayerRenderer.update(x, y);
        this.setState({
          x: x,
          y: y
        });
        break;
      case 4:
        let enemy = this.props.dungeon.enemies.filter(function(enemy) {
          return enemy.x === x && enemy.y === y;
        })[0];
        let enemyData = enemy.attackPlayer(this.state);
        let newState = {
          health: this.state.health - enemyData.damage
        };
        if(enemyData.dead) {
          newState.enemies = {
            killed: this.state.enemies.killed + 1,
            total: this.state.enemies.total
          };
        }
        this.setState(newState);
        break;
      case 5:
        let weapon = this.props.dungeon.weapons.filter(function(weapon) {
          return weapon.x === x && weapon.y === y;
        })[0];
        let newWeapon = weapon.getTaken();
        newWeapon.attack += this.state.weapon.attack;
        this.setState({
          x: x,
          y: y,
          weapon: newWeapon
        });
        break;
      case 6:
        let pickup = this.props.dungeon.pickups.filter(function(pickup) {
          return pickup.x === x && pickup.y === y;
        })[0];
        let newHealth = this.state.health + pickup.getTaken();
        this.setState({
          x: x,
          y: y,
          health: Math.min(100, newHealth)
        });
        break;
    }
  },
  render: function() {
    PlayerRenderer.update(this.state.x, this.state.y);
    return (
      <div>
        <Info enemies={this.state.enemies} weapon={this.state.weapon} health={this.state.health}/>
        <br/>
        <canvas style={{zIndex: 1, position: "absolute"}} ref="canvas" width={this.props.width} height={this.props.height}/>
      </div>
    );
  }
});

var Info = React.createClass({
  render: function() {
    return (
      <div className="info">
        <h2>Kill all enemies: {this.props.enemies.killed}/{this.props.enemies.total}</h2>
        <div className="health">
          <span ref="span" style={
            {
              width: this.props.health + "%"
            }
          }/>
        </div>
        <p>{this.props.weapon.name} - {this.props.weapon.attack} Attack</p>
      </div>
    );
  }
});

var Game = React.createClass({
  getInitialState: function() {
    return {
      map: [],
    }
  },
  componentWillMount: function() {
    var dungeon = new DungeonGenerator.Dungeon();
    dungeon.generate();
    this.setState({
      dungeon: dungeon
    });
  },
  render: function() {
    var height = window.innerHeight * 0.7;
    var width = window.innerWidth * 0.7;
    return (
      <div className="wrapper" style={{position: "relative"}}>
        <h1>Roguelike</h1>
        <Player dungeon={this.state.dungeon} width={width} height={height}/>
        <DungeonMap dungeon={this.state.dungeon} width={width} height={height}/>
      </div>
    );
  }
});

module.exports = Game;
