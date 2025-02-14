import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Exit } from '../model/exit';
import { Item } from '../model/item';
import { Monster } from '../model/monster';
import { MonstersEsp } from '../model/monstersEsp';
import { Player } from '../model/player';
import { Room } from '../model/room';
import { SessionService } from '../shared/session-service.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css','./nicepage.css']
})
export class GameComponent implements OnInit {
  actualPlayer: Player | undefined;
  actualRoomPlayers : Player[] | undefined;
  actualType : MonstersEsp | undefined;
  isMonsterAlive: Boolean = true;
  sum: number = 0;
  numAux: number = 0;
  numAuxp: number = 0;
  logBook: String[] = []

  constructor(private sessionService:SessionService,private router:Router) { }

  ngOnInit(): void {
    this.actualPlayer = JSON.parse(sessionStorage.getItem("actualPlayer")!);
    this.logBook = JSON.parse(sessionStorage.getItem("logBook")!);
    this.actualType
    this.sumWeightBackpack();

    this.sessionService.getPlayerList(this.actualPlayer?.room!).subscribe((players)=>{
      this.actualRoomPlayers = players;
    });

    if (this.actualPlayer?.hp as number <= 0 || this.actualPlayer?.clock as number >= 20){
      this.playAudioDeath();
      sessionStorage.setItem("actualPlayer",JSON.stringify(this.actualPlayer));
      sessionStorage.setItem("logBook",JSON.stringify(this.logBook));
      this.router.navigate(['end']);
    }

    if (this.actualPlayer?.room.monster == undefined || this.actualPlayer.room.monster.hp <= 0){
      this.isMonsterAlive = false;
    } else {this.sessionService.getMonsterType(this.actualPlayer?.room.monster!).subscribe((espec)=>{
      this.actualType = espec;
    });}
  }
  throwItem(item: Item): void {
    this.playAudioDrop();
    this.sessionService.throwPlayerItem(this.actualPlayer as Player, item).subscribe((player) => {
      this.actualPlayer = player;
      sessionStorage.setItem("actualPlayer",JSON.stringify(player));
      this.logBook.push(this.actualPlayer.username + " Throw " + item.name);
      sessionStorage.setItem("logBook",JSON.stringify(this.logBook));
    });
  }

  pickUpItem(item: Item): void {
    this.playAudioDrop();
    if (this.actualPlayer?.weight as number >= this.sumWeightBackpack() + item.weight){
      this.sessionService.pickUpItemFromRoom(this.actualPlayer as Player, item).subscribe((player) => {
        this.actualPlayer = player;
        sessionStorage.setItem("actualPlayer",JSON.stringify(player));
        this.logBook.push(this.actualPlayer.username + " Pick up " + item.name);
        sessionStorage.setItem("logBook",JSON.stringify(this.logBook));
      });
    }else{
      console.log("You can not pick up this item, it is too heavy to carry" , this.sumWeightBackpack());
      this.logBook.push(this.actualPlayer?.username + " Tried to pick up " + item.name + " but does not have space for it. ");
      sessionStorage.setItem("logBook",JSON.stringify(this.logBook));
    }

  }
  sumWeightBackpack(): number{
    this.sum = 0;
    for( let itemSelect of this.actualPlayer?.backpack as Item[]){
      this.sum = this.sum + itemSelect.weight;
    }
    return this.sum;
  }

  changeRoom(exit: Exit): void {
    this.sessionService.nextRoom(exit).subscribe((room)=>{
      console.log(room);
      this.sessionService.changeRoom(this.actualPlayer as Player, room).subscribe((player) =>{
        this.actualPlayer = player;
        sessionStorage.setItem("actualPlayer",JSON.stringify(player));
        this.logBook.push(this.actualPlayer.username + " Move to  " + room.name);
        sessionStorage.setItem("logBook",JSON.stringify(this.logBook));
        window.location.reload();
      });
    });

  }

  escapeRoom(exit: Exit): void {
    this.attackPlayerByMonster();
    this.logBook.push(this.actualPlayer?.username + " Escape");
    sessionStorage.setItem("logBook",JSON.stringify(this.logBook));
    this.changeRoom(exit);
  }


  attackMonster(monster : Monster | undefined): void {
    console.log(monster);
    this.playAudioHit();
    this.sessionService.getMonsterType(this.actualPlayer?.room.monster!).subscribe((espec)=>{
      this.numAux = this.random(0,this.actualPlayer?.attack_level as number) - this.random(0,espec.defence_slash);
      if (this.numAux < 0){this.numAux=this.numAux*(-1)}
      this.sessionService.attackMonsterByPlayer(this.actualPlayer as Player, this.numAux).subscribe((player)=>{
        this.actualPlayer = player;
        sessionStorage.setItem("actualPlayer",JSON.stringify(player));
        this.logBook.push(this.actualPlayer.username + " Attacked " + this.actualPlayer?.room.monster?.name + "(" + espec.name + ") with " + this.numAux + " of damage.");
        if(this.actualPlayer.room.monster?.hp as number <= 0 ){
          this.isMonsterAlive = !this.isMonsterAlive
          this.logBook.push(this.actualPlayer.username + " killed " + this.actualPlayer?.room.monster?.name + "(" + espec.name + ")");
        }
        sessionStorage.setItem("logBook",JSON.stringify(this.logBook));
        this.attackPlayerByMonster();
      });
    });
  }


  attackPlayerByMonster(): void{
    if(this.isMonsterAlive == true  && this.actualPlayer?.hp! > 0){
      this.playAudioHit();
      this.sessionService.getMonsterType(this.actualPlayer?.room.monster!).subscribe((a)=>{
        this.numAuxp = this.random(0,a.attack_level as number) - this.random(0,this.actualPlayer?.defence_slash as number);
        if (this.numAuxp < 0){this.numAuxp=this.numAuxp*(-1)}
        this.sessionService.attackPlayerByMonster(this.actualPlayer as Player, (this.actualPlayer?.hp! - this.numAuxp) as number).subscribe((player)=>{
          this.actualPlayer = player;
          sessionStorage.setItem("actualPlayer",JSON.stringify(player));
          this.logBook.push(this.actualPlayer?.room.monster?.name + "(" + a.name + ")"  + " Attacked " + this.actualPlayer.username + " with " + this.numAuxp + " of damage.");
          sessionStorage.setItem("logBook",JSON.stringify(this.logBook));
          if(this.actualPlayer.hp<=0){window.location.reload();}
        });
      });
    } else {window.location.reload();}
  }

  random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  playAudioDeath(){
    let audio = new Audio();
    audio.src = "../../../assets/sounds/death.mp3";
    audio.load();
    audio.play();
  }

  playAudioDrop(){
    let audio = new Audio();
    audio.src = "../../../assets/sounds/drop.mp3";
    audio.load();
    audio.play();
  }

  playAudioHit(){
    let audio = new Audio();
    audio.src = "../../../assets/sounds/hit.mp3";
    audio.load();
    audio.play();
  }

}
