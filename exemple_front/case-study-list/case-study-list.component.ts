import {
    Component,
    ChangeDetectionStrategy,
    OnDestroy,
    ViewChild,
} from "@angular/core";
import { Router } from "@angular/router";

import {
    SortMeta,
    MenuItem,
    MessageService,
    ConfirmationService,
} from "primeng/api";
import { Dropdown } from "primeng/dropdown";
import { Menu } from "primeng/menu";
import { Table } from "primeng/table";
import { Observable, Subject } from "rxjs";

import { PermissionsService } from "src/app/permission/permissions.service";
import { SitesQuery } from "src/app/sites/state";
import { UserInfoService } from "src/app/users/state";
import { ActionStateService } from "src/framework/core";

import { CaseStudyDialogComponent } from "./case-study-dialog/case-study-dialog.component";
import { CaseStudyBlastFurnaceUser } from "./model";
import { CaseStudyQuery, CaseStudyService } from "./state";

@Component({
    templateUrl: "./case-study-list.component.html",
    styleUrls: ["./case-study-list.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseStudyListComponent implements OnDestroy {
    @ViewChild("menu") public readonly menu!: Menu;
    @ViewChild("drop") public readonly drop!: Dropdown;
    @ViewChild(CaseStudyDialogComponent)
    public readonly caseStudyDialog!: CaseStudyDialogComponent;

    public table: Table | undefined;
    @ViewChild(Table) public set content(content: Table) {
        this.table = content;
    }

    public multiSortMeta: Array<SortMeta> = [
        { field: "blastFurnaceName", order: 1 },
        { field: "name", order: 1 },
    ];

    public menuItems: Array<MenuItem> = [];
    public caseStudie$: Observable<Array<CaseStudyBlastFurnaceUser>>;
    private readonly disposeSignal: Subject<void> = new Subject();

    constructor(
        private readonly caseStudyService: CaseStudyService,
        public readonly caseStudyQuery: CaseStudyQuery,
        public readonly siteQuery: SitesQuery,
        private readonly userService: UserInfoService,
        private readonly router: Router,
        private readonly messageService: MessageService,
        private readonly confirmationService: ConfirmationService,
        private readonly permissionsService: PermissionsService,
        public readonly actionStateService: ActionStateService
    ) {

        this.userService.getUsers().subscribe();

        this.caseStudie$ = this.caseStudyQuery.caseStudies$;
    }

    public ngOnDestroy(): void {
        this.disposeSignal.next();
    }

    public toggleMenu(event: MouseEvent, caseStudyId: number): void {
        if (!this.menu.visible) {
            this.caseStudyService.selectCaseStudy(caseStudyId);
            this.menuItems = this.getMenuItems(
                this.caseStudyQuery.getSelected()!
            );
        }

        this.menu.toggle(event);
    }

    public onRowSelect(event: { data: { id: number } }): void {
        this.openCaseStudy(event.data.id);
    }

    public createCaseStudy(): void {
        this.caseStudyDialog.create();
    }

    private getMenuItems(
        caseStudy: CaseStudyBlastFurnaceUser
    ): Array<MenuItem> {
        const canWrite: boolean = this.permissionsService.can(
            "write",
            "CaseStudy",
            caseStudy
        );
        return [
            {
                label: "Open",
                command: () => {
                    this.caseStudyService.selectCaseStudy(null);
                    this.openCaseStudy(caseStudy.id);
                },
                icon: "pi pi-fw pi-file-o",
            },
            {
                label: "Edit",
                visible: canWrite,
                command: () => {
                    if (this.caseStudyQuery.isReadonly(caseStudy.id)) {
                        this.messageService.add({
                            severity: "error",
                            summary:
                                "Edit is not allowed when case study is running, processing or in queue.",
                        });
                    } else {
                        return this.caseStudyDialog.edit(caseStudy.id);
                    }
                },
                icon: "pi pi-fw pi-pencil",
            },
            {
                label: "Duplicate",
                command: () => this.caseStudyDialog.duplicate(caseStudy.id),
                icon: "pi pi-fw pi-clone",
            },
            {
                label: "Delete",
                visible: canWrite,
                command: () => {
                    if (this.caseStudyQuery.isReadonly(caseStudy.id)) {
                        this.messageService.add({
                            severity: "error",
                            summary:
                                "Delete is not allowed when case study is running, processing or in queue.",
                        });
                    } else {
                        return this.deleteCaseStudy();
                    }
                },
                icon: "pi pi-fw pi-trash",
            },
        ];
    }

    private openCaseStudy(id: number): void {
        this.router.navigate(["case-studies", id]);
    }
    private deleteCaseStudy(): void {

    }
}
