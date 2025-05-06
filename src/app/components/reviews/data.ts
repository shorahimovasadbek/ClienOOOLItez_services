import { Component, OnInit } from "@angular/core";
import { LocalStorageService } from "../../services/localstorage.service";
import { Router } from "@angular/router";

@Component({
    selector: 'reviews',
    templateUrl: './data.html'
})
export class ReviewsComponent implements OnInit {
    activeButton = 'orders'
    rating = 3;
    hoverRating = 0;
    pageParams = {
        from: 0,
        to: 0,
        total: 0,
        per_page: 0,
        page: 1,
        current_page: 0,
        last_page: 0
    }
    isColleaguesRoute
    constructor(
        private localStorage: LocalStorageService,
        private router: Router
    ) {
        this.router.events.subscribe(() => {
            this.isColleaguesRoute = this.router.url.startsWith('/colleagues');
        });
    }
    ngOnInit(): void {
        this.pageParams.per_page = this.localStorage.getItem('per_page') || 30;
    }
    getDataItems() {

    }
    setActive(button: string) {
        this.activeButton = button;
    }
    setRating(star: number) {
        this.rating = star;
    }
    updatePageSize(perPage: number) {
        this.localStorage.setItem('per_page', perPage);
        this.pageParams.per_page = perPage;
        this.getDataItems();
    }
    changePage(newPage: number) {
        if (newPage >= 1 && newPage <= this.pageParams.last_page) {
            this.pageParams.page = newPage;
            this.getDataItems();
        }
    }
}