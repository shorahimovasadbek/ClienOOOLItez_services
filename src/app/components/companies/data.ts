import { Component, OnInit } from "@angular/core";
import { CompaniesService } from "../../services/companies.service";

@Component({
    selector: 'companies',
    templateUrl: './data.html'
})
export class CompaniesComponent implements OnInit {
    loadingPage =  false;
    dataItems
    constructor(
        private DataApi: CompaniesService
    ) { }

    ngOnInit(): void {
        this.getDataItems();
    }
    getDataItems() {
        this.loadingPage = true;
        this.DataApi.getCompanies().subscribe((res: any) => {
            if (res) {
                this.dataItems = res;
                this.loadingPage = false;
            }
        }, err => {
            this.loadingPage = false;
        })
    }
}
