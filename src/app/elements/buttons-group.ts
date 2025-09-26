import { Component } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';

@Component({
    templateUrl: './buttons-group.html',
    animations: [toggleAnimation],
})
export class ButtonsGroupComponent {
    codeArr: any = [];
    toggleCode = (name: string) => {
        if (this.codeArr.includes(name)) {
            this.codeArr = this.codeArr.filter((d: string) => d != name);
        } else {
            this.codeArr.push(name);
        }
    };

    constructor() {}
}
