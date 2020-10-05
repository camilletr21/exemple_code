import { Component, OnInit } from "@angular/core";
import {
    Validators,
    FormBuilder,
    FormGroup,
    AbstractControl,
    ValidatorFn,
    ValidationErrors,
} from "@angular/forms";
import { MessageService } from "primeng"; // todo à virer

import { ModalDialogRef } from "../../../framework/ui/modal/modal-dialog.service";
import { User } from "../../session/model/user.model";
import { SessionQuery } from "../../session/state";
import { CaseStudy } from "../model";
import { CaseStudyQuery } from "../state";
import { CaseStudyService } from "../state/case-study.service";
import { CaseStudyStore } from "../state/case-study.store";

@Component({
    selector: "app-create-case-study",
    templateUrl: "./create-case-study.component.html",
    styleUrls: ["./create-case-study.component.scss"],
    // il faut l'ajouter aux providers du conatiner DI, por avoir une nouvelle instance
    // (celle qu'on a créée en ouvrant le dialogue) à chaque ouverture
    providers: [ModalDialogRef],
})
export class CreateCaseStudyComponent implements OnInit {
    public edit = false;
    public createCaseStudy: FormGroup;
    private user: User;
    private caseStudy: CaseStudy;
    private userCaseStudiesNames: Array<string>;

    constructor(
        private readonly csService: CaseStudyService,
        private readonly csQuery: CaseStudyQuery,
        private readonly sessionQuery: SessionQuery,
        private readonly store: CaseStudyStore,
        private readonly closingDialogRef: ModalDialogRef,
        private readonly messageService: MessageService,
        private readonly fb: FormBuilder
    ) {}

    public ngOnInit(): void {
        const userId = 197; // TODO recup l'id du vrai user
        this.user = this.sessionQuery.getUser();
        this.caseStudy = this.csQuery.getActive();
        this.userCaseStudiesNames = this.csQuery
            .getAll({
                filterBy: (cs) =>
                    cs.id !== this.caseStudy.id && cs.owner === userId,
            })
            .map((cs) => cs.name);

        this.createCaseStudy = this.fb.group({
            name: [
                "",
                [
                    Validators.required,
                    this.validateUniqueName(this.userCaseStudiesNames),
                ],
            ],
            comment: [""],
        });

        if (this.csQuery.hasActive()) {
            this.createCaseStudy.setValue({
                name: this.caseStudy.name,
                comment: this.caseStudy.comments,
            });
            this.edit = true;
        }
    }

    public onSubmit(form: FormGroup): void {
        const cs: CaseStudy = {
            id: this.caseStudy.id || 1,
            name: form.value.name,
            owner: this.caseStudy.owner || 197,
            publicAccess: this.caseStudy.publicAccess || false,
            comments: form.value.comment,
            creationDate: this.caseStudy.creationDate || new Date(),
            lastCalculatedDate: this.caseStudy.lastCalculatedDate || null,
        };
        if (this.edit) {
            this.csService.updateCaseStudy(26, cs, +this.caseStudy.id);
            this.store.setActive(null);
        } else {
            this.csService.addCaseStudy(26, cs);
        }
        this.closingDialogRef.close(cs);
    }

    public cancel(): void {
        this.closingDialogRef.close();
        this.store.setActive(null);
    }

    private validateUniqueName(nameList: Array<string>): ValidatorFn {
    }
}
