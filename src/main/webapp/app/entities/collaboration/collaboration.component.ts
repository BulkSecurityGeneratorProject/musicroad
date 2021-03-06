import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { JhiEventManager, JhiParseLinks, JhiAlertService } from 'ng-jhipster';

import { ICollaboration } from 'app/shared/model/collaboration.model';
import { AccountService, IUser } from 'app/core';

import { ITEMS_PER_PAGE } from 'app/shared';
import { CollaborationService } from './collaboration.service';
import { BandService } from 'app/entities/band/band.service';
import { IBand } from 'app/shared/model/band.model';
import { UserResolve } from 'app/admin';
import { numberLiteralTypeAnnotation } from '@babel/types';

@Component({
    selector: 'jhi-collaboration',
    templateUrl: './collaboration.component.html'
})
export class CollaborationComponent implements OnInit, OnDestroy {
    collaborations: ICollaboration[];
    currentAccount: any;
    eventSubscriber: Subscription;
    itemsPerPage: number;
    links: any;
    page: any;
    previousPage: any;
    predicate: any;
    reverse: any;
    totalItems: number;
    currentSearch: string;
    user: IUser;

    onlyMyCollaborations = false;

    constructor(
        protected collaborationService: CollaborationService,
        protected jhiAlertService: JhiAlertService,
        protected eventManager: JhiEventManager,
        protected parseLinks: JhiParseLinks,
        protected activatedRoute: ActivatedRoute,
        protected accountService: AccountService,
        protected bandService: BandService,
        private router: Router
    ) {
        this.collaborations = [];
        this.itemsPerPage = ITEMS_PER_PAGE;
        this.page = 1;
        this.links = {
            last: 0
        };
        this.predicate = 'id';
        this.reverse = true;
        if (this.activatedRoute.snapshot.url.toString() === 'my-collaborations') {
            this.onlyMyCollaborations = true;
        }
        this.accountService.fetch().subscribe((response: HttpResponse<IUser>) => {
            this.user = response.body;
            if (this.onlyMyCollaborations) {
                this.currentSearch = 'bands.user.login:(' + this.user.login + ')';
            } else {
                this.currentSearch =
                    this.activatedRoute.snapshot && this.activatedRoute.snapshot.params['search']
                        ? this.activatedRoute.snapshot.params['search']
                        : '';
            }
        });
    }

    loadAll() {
        if (this.currentSearch) {
            this.collaborationService
                .search({
                    query: this.currentSearch,
                    page: this.page - 1,
                    size: this.itemsPerPage,
                    sort: this.sort()
                })
                .subscribe(
                    (res: HttpResponse<ICollaboration[]>) => this.paginateCollaborations(res.body, res.headers),
                    (res: HttpErrorResponse) => this.onError(res.message)
                );
            return;
        } else if (this.onlyMyCollaborations) {
            this.collaborationService
                .query({
                    query: this.currentSearch = 'bands.user.login:(' + this.user.login + ')',
                    page: this.page - 1,
                    size: this.itemsPerPage,
                    sort: this.sort()
                })
                .subscribe(
                    (res: HttpResponse<ICollaboration[]>) => this.paginateCollaborations(res.body, res.headers),
                    (res: HttpErrorResponse) => this.onError(res.message)
                );
        } else {
            this.collaborationService
                .query({
                    page: this.page - 1,
                    size: this.itemsPerPage,
                    sort: this.sort()
                })
                .subscribe(
                    (res: HttpResponse<ICollaboration[]>) => this.paginateCollaborations(res.body, res.headers),
                    (res: HttpErrorResponse) => this.onError(res.message)
                );
        }
    }

    reset() {
        this.page = 0;
        this.collaborations = [];
        this.currentSearch = 'bands.user.login:(' + this.user.login + ')';
        this.loadAll();
    }

    // loadPage(page) {
    //     this.page = page;
    //     this.loadAll();
    // }

    clear() {
        this.collaborations = [];
        this.links = {
            last: 0
        };
        this.page = 0;
        this.predicate = 'id';
        this.reverse = true;
        this.currentSearch = 'bands.user.login:(' + this.user.login + ')';
        this.loadAll();
    }

    search(query) {
        if (!query) {
            return this.clear();
        }
        this.collaborations = [];
        this.links = {
            last: 0
        };
        this.page = 0;
        this.predicate = '_score';
        this.reverse = false;
        this.currentSearch = query;
        this.loadAll();
    }

    ngOnInit() {
        if (this.activatedRoute.snapshot.url.toString() === 'my-collaborations') {
            this.onlyMyCollaborations = true;
        }
        this.accountService.fetch().subscribe((response: HttpResponse<IUser>) => {
            this.user = response.body;
            if (this.onlyMyCollaborations) {
                this.currentSearch = 'bands.user.login:(' + this.user.login + ')';
            } else {
                this.currentSearch =
                    this.activatedRoute.snapshot && this.activatedRoute.snapshot.params['search']
                        ? this.activatedRoute.snapshot.params['search']
                        : '';
            }
            this.loadAll();
            this.accountService.identity().then(account => {
                this.currentAccount = account;
            });
            this.registerChangeInCollaborations();
        });
        this.loadAll();
        this.accountService.identity().then(account => {
            this.currentAccount = account;
        });
        this.registerChangeInCollaborations();
    }

    ngOnDestroy() {
        this.eventManager.destroy(this.eventSubscriber);
    }

    trackId(index: number, item: ICollaboration) {
        return item.id;
    }

    registerChangeInCollaborations() {
        this.eventSubscriber = this.eventManager.subscribe('collaborationListModification', response => this.reset());
    }

    sort() {
        const result = [this.predicate + ',' + (this.reverse ? 'asc' : 'desc')];
        if (this.predicate !== 'id') {
            result.push('id');
        }
        return result;
    }

    protected paginateCollaborations(data: ICollaboration[], headers: HttpHeaders) {
        this.links = this.parseLinks.parse(headers.get('link'));
        this.totalItems = parseInt(headers.get('X-Total-Count'), 10);
        this.collaborations = [];
        for (let i = 0; i < data.length; i++) {
            this.collaborations.push(data[i]);
        }
    }

    protected onError(errorMessage: string) {
        this.jhiAlertService.error(errorMessage, null, null);
    }

    loadPage(page: number) {
        if (page !== this.previousPage) {
            this.previousPage = page;
            this.transition();
        }
    }

    transition() {
        this.router.navigate(['/collaboration/my-collaborations'], {
            queryParams: {
                query: this.currentSearch,
                page: this.page,
                size: this.itemsPerPage,
                sort: this.predicate + ',' + (this.reverse ? 'asc' : 'desc')
            }
        });
        this.loadAll();
    }
}
