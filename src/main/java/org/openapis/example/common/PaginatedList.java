/*
 * Copyright 2016 Capital One Services, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License. 
 */

package org.openapis.example.common;

import java.util.List;

public class PaginatedList<T> {
	private List<T> items;

	public PaginatedList() {
	}

	public PaginatedList(List<T> entries) {
		this.items = entries;
	}

	public List<T> getItems() {
		return items;
	}

	public void setItems(List<T> entries) {
		this.items = entries;
	}

	@Override
	public String toString() {
		return String.format("PagedList[items=%s]", items);
	}
}
