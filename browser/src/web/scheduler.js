export class Scheduler {
 constructor(){this.tasks=new Set();this.paused=false;}
 schedule(delay,fn){const task={remaining:delay,fn,start:0,id:null};this.tasks.add(task);if(!this.paused)this.arm(task);return()=>{clearTimeout(task.id);this.tasks.delete(task);};}
 arm(task){task.start=performance.now();task.id=setTimeout(()=>{this.tasks.delete(task);task.fn();},Math.max(0,task.remaining));}
 pause(){if(this.paused)return;this.paused=true;for(const task of this.tasks){clearTimeout(task.id);task.remaining=Math.max(0,task.remaining-(performance.now()-task.start));}}
 resume(){if(!this.paused)return;this.paused=false;for(const task of this.tasks)this.arm(task);}
 clear(){for(const task of this.tasks)clearTimeout(task.id);this.tasks.clear();}
}
