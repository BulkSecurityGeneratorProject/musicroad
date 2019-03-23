import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BandService } from 'app/entities/band/band.service';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { JhiParseLinks, JhiAlertService } from 'ng-jhipster';
import { Title } from '@angular/platform-browser';
import { IBand } from 'app/shared/model/band.model';

@Component({
    selector: 'jhi-searcher',
    templateUrl: './searcher.component.html',
    styles: []
})
export class SearcherComponent implements OnInit {
    currentSearch: string;
    page: any;
    itemsPerPage: number;
    predicate: any;
    reverse: any;
    links: any;
    totalItems: number;
    title = 'app';
    genres = ['Rock', 'RandB', 'Soul', 'Pop', 'Latin', 'Jazz', 'HipHop', 'Folk', 'Electronic', 'Country', 'Blues', 'Flamenco'];
    cities = [
        'Madrid',
        'Sevilla',
        'Malaga',
        'Huelva',
        'Valladolid',
        'Granada',
        'Barcelona',
        'Jaén',
        'A Coruña',
        'Guadalajara',
        'Huesca',
        'Lugo',
        'La Rioja',
        'Gipuzkoa',
        'Pontevedra',
        'Teruel'
    ];
    bands: IBand[];

    constructor(
        protected activatedRoute: ActivatedRoute,
        protected bandService: BandService,
        protected parseLinks: JhiParseLinks,
        protected jhiAlertService: JhiAlertService,
        private titleService: Title
    ) {
        this.currentSearch =
            this.activatedRoute.snapshot && this.activatedRoute.snapshot.params['search']
                ? this.activatedRoute.snapshot.params['search']
                : '';
    }

    //   ngOnInit() {

    //     if (this.currentSearch) {
    //         this.bandService
    //             .search({
    //                 query: this.currentSearch,
    //                 page: this.page,
    //                 size: this.itemsPerPage,
    //                 sort: this.sort()
    //             })
    //             .subscribe(
    //                 (res: HttpResponse<IBand[]>) => this.paginateBands(res.body, res.headers),
    //                 (res: HttpErrorResponse) => this.onError(res.message)
    //             );
    //         return;
    //     }
    //     this.bandService
    //         .query({
    //             page: this.page,
    //             size: this.itemsPerPage,
    //             sort: this.sort()
    //         })
    //         .subscribe(
    //             (res: HttpResponse<IBand[]>) => this.paginateBands(res.body, res.headers),
    //             (res: HttpErrorResponse) => this.onError(res.message)
    //         );
    //   }

    ngOnInit() {
        this.loadAll();
        this.titleService.setTitle('Search');
    }

    loadAll() {
        if (this.currentSearch) {
            this.bandService
                .search({
                    query: this.currentSearch,
                    page: this.page,
                    size: this.itemsPerPage,
                    sort: this.sort()
                })
                .subscribe(
                    (res: HttpResponse<IBand[]>) => this.paginateBands(res.body, res.headers),
                    (res: HttpErrorResponse) => this.onError(res.message)
                );
            return;
        }
        this.bandService
            .query({
                page: this.page,
                size: this.itemsPerPage,
                sort: this.sort()
            })
            .subscribe(
                (res: HttpResponse<IBand[]>) => this.paginateBands(res.body, res.headers),
                (res: HttpErrorResponse) => this.onError(res.message)
            );
    }

    sort() {
        const result = [this.predicate + ',' + (this.reverse ? 'asc' : 'desc')];
        if (this.predicate !== 'id') {
            result.push('id');
        }
        return result;
    }

    clear() {
        this.bands = [];
        this.links = {
            last: 0
        };
        this.page = 0;
        this.predicate = 'id';
        this.reverse = true;
        this.currentSearch = '';
        this.loadAll();
    }

    search(query) {
        if (!query) {
            return this.clear();
        }
        this.bands = [];
        this.links = {
            last: 0
        };
        this.page = 0;
        this.predicate = '_score';
        this.reverse = false;
        this.currentSearch = query;
        this.loadAll();
    }

    protected paginateBands(data: IBand[], headers: HttpHeaders) {
        this.links = this.parseLinks.parse(headers.get('link'));
        this.totalItems = parseInt(headers.get('X-Total-Count'), 10);
        for (let i = 0; i < data.length; i++) {
            this.bands.push(data[i]);
        }
    }

    protected onError(errorMessage: string) {
        this.jhiAlertService.error(errorMessage, null, null);
    }
}
